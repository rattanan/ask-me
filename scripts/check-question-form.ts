import { chromium, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import { getPool } from "../lib/db";
import { upsertUser, saveSession } from "../lib/storage";
loadEnvConfig(process.cwd());
async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  let owner = "";
  try {
    const id = randomUUID();
    const user = await upsertUser({ googleId: id, email: `${id}@example.test`, name: "Form test", image: "" });
    owner = user.id;
    const session = await saveSession(owner, { title: "Form test", description: "", presenter: "", date: "2026-09-08", active: true, allowQuestions: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    let fail = false;
    const sent: { name: string; emoji: string; color: string; question: string }[] = [];
    await page.route("**/api/public/questions/submit", async route => {
      sent.push(route.request().postDataJSON());
      if (fail) await route.abort();
      else await route.fulfill({ status: 201, json: { status: "approved" } });
    });
    await page.goto(`http://localhost:3000/question/${session.id}`);
    await page.getByPlaceholder("Your name").fill("ผู้ถามเดิม");
    await page.getByRole("button", { name: "Choose 🚀", exact: true }).click();
    const colors = page.locator('button[aria-pressed]').filter({ hasText: /Pink|ชมพู/ });
    await colors.click();
    const input = page.getByPlaceholder("What would you like to ask?");
    await input.fill("คำถามแรก");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.getByText("ส่งคำถามสำเร็จแล้ว", { exact: true })).toBeVisible();
    await expect(input).toHaveValue("");
    await expect(page.getByPlaceholder("Your name")).toHaveValue("ผู้ถามเดิม");
    await expect(page.getByRole("button", { name: "Choose 🚀", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(colors).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ path: "/tmp/ask-me-question-balloon.png" });
    await expect(page.getByText("ส่งคำถามสำเร็จแล้ว", { exact: true })).toBeHidden({ timeout: 5000 });
    await input.fill("คำถามที่สอง");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.getByText("ส่งคำถามสำเร็จแล้ว", { exact: true })).toBeVisible();
    if (sent[1].name !== "ผู้ถามเดิม" || sent[1].emoji !== "🚀" || sent[1].color !== "pink") throw new Error("Preferences were reset");
    fail = true;
    await input.fill("ลองใหม่เมื่อเครือข่ายขัดข้อง");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(input).toHaveValue("ลองใหม่เมื่อเครือข่ายขัดข้อง");
    await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeEnabled();
    console.log("Form passed: preferences retained, only question reset, balloon dismisses/reappears, failed submission retains draft.");
  } finally {
    await browser.close();
    if (owner) await getPool().execute("DELETE FROM users WHERE id=?", [owner]);
    await getPool().end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
