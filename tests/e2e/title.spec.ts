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
    // hydration 完了を待ってからクリック
    await page.waitForLoadState('networkidle')
    await page.getByText('はじめから').click()
    await expect(page).toHaveURL('/game', { timeout: 10000 })
  })
})

test.describe('ゲーム画面', () => {
  test('ゲームコンテナが表示される', async ({ page }) => {
    await page.goto('/game')
    // headless CI では WebGL 非対応のため canvas は検証しない
    await expect(page.locator('.game-container')).toBeVisible({ timeout: 10000 })
  })

  test('キーボード入力でクラッシュしない', async ({ page }) => {
    await page.goto('/game')
    await expect(page.locator('.game-container')).toBeVisible({ timeout: 10000 })

    // WASD と矢印キーを入力してもページが維持される
    for (const key of ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']) {
      await page.keyboard.press(key)
    }

    await expect(page).toHaveURL('/game')
    await expect(page.locator('.game-container')).toBeVisible()
  })
})
