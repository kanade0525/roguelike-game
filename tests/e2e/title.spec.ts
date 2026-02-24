import { test, expect } from '@playwright/test'

test.describe('タイトル画面', () => {
  test('タイトルとメニューが表示される', async ({ page }) => {
    await page.goto('/')

    // タイトルテキスト
    await expect(page.locator('h1')).toContainText('ローグライク')
    await expect(page.locator('h2')).toContainText('ダンジョン')

    // メニューボタン
    await expect(page.getByText('はじめから')).toBeVisible()
    await expect(page.getByText('つづきから')).toBeVisible()
    await expect(page.getByText('せってい')).toBeVisible()
  })

  test('「つづきから」ボタンは無効状態', async ({ page }) => {
    await page.goto('/')
    const continueBtn = page.getByText('つづきから')
    await expect(continueBtn).toBeDisabled()
  })

  test('「はじめから」でゲーム画面に遷移する', async ({ page }) => {
    await page.goto('/')
    await page.getByText('はじめから').click()
    await expect(page).toHaveURL('/game')
  })
})

test.describe('ゲーム画面', () => {
  test('ゲームコンテナが表示される', async ({ page }) => {
    await page.goto('/game')
    // GameCanvas.client.vue の .game-container が表示される
    await expect(page.locator('.game-container')).toBeVisible({ timeout: 10000 })
  })
})
