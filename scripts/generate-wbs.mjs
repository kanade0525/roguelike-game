#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const wbsPath = resolve(__dirname, '../docs/wbs.json')
const outPath = resolve(__dirname, '../docs/critical-path.md')

const { tasks } = JSON.parse(readFileSync(wbsPath, 'utf-8'))

// 調整後工数を計算
const taskMap = new Map()
for (const t of tasks) {
  const adjusted = Math.round(t.estimate * t.factor * 10) / 10
  taskMap.set(t.id, { ...t, adjusted })
}

// クリティカルパス計算（最長経路）
function calcLongestPath(taskId, memo = new Map()) {
  if (memo.has(taskId)) return memo.get(taskId)
  const task = taskMap.get(taskId)
  if (task.deps.length === 0) {
    const result = { cost: task.adjusted, path: [taskId] }
    memo.set(taskId, result)
    return result
  }
  let best = { cost: 0, path: [] }
  for (const dep of task.deps) {
    const sub = calcLongestPath(dep, memo)
    if (sub.cost > best.cost) best = sub
  }
  const result = { cost: best.cost + task.adjusted, path: [...best.path, taskId] }
  memo.set(taskId, result)
  return result
}

// 全タスクの終端から最長経路を求める
let criticalPath = { cost: 0, path: [] }
for (const t of tasks) {
  const result = calcLongestPath(t.id)
  if (result.cost > criticalPath.cost) criticalPath = result
}
const cpSet = new Set(criticalPath.path)

// Mermaid用のID（ハイフンを除去）
const mid = (id) => id.replace('-', '')

// WBSテーブル生成
let md = '# クリティカルパス・依存関係図\n\n'
md += '## WBS\n\n'
md += '| タスクID | 機能 | タスク | 依存関係 | 見積(h) | 係数 | 調整後(h) |\n'
md += '| -------- | ---- | ------ | -------- | ------- | ---- | --------- |\n'
for (const t of tasks) {
  const task = taskMap.get(t.id)
  const deps = task.deps.length > 0 ? task.deps.join(', ') : '-'
  md += `| ${task.id} | ${task.category} | ${task.name} | ${deps} | ${task.estimate} | ${task.factor} | ${task.adjusted} |\n`
}

// Mermaid図生成
md += '\n## 依存関係図（クリティカルパス強調）\n\n'
md += '```mermaid\ngraph LR\n'

// ノード定義
for (const t of tasks) {
  const task = taskMap.get(t.id)
  md += `    ${mid(t.id)}["${t.id} ${task.name}<br>${task.adjusted}h"]\n`
}
md += '\n'

// クリティカルパスの辺
const cpEdges = new Set()
for (let i = 1; i < criticalPath.path.length; i++) {
  cpEdges.add(`${criticalPath.path[i - 1]}->${criticalPath.path[i]}`)
}

// 辺の描画
for (const t of tasks) {
  for (const dep of t.deps) {
    const edgeKey = `${dep}->${t.id}`
    if (cpEdges.has(edgeKey)) {
      md += `    ${mid(dep)} ==> ${mid(t.id)}\n`
    } else {
      md += `    ${mid(dep)} -.-> ${mid(t.id)}\n`
    }
  }
}
md += '\n'

// スタイル
for (const t of tasks) {
  if (cpSet.has(t.id)) {
    md += `    style ${mid(t.id)} fill:#ff6b6b,stroke:#c0392b,color:#fff\n`
  } else {
    md += `    style ${mid(t.id)} fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50\n`
  }
}
md += '```\n'

// クリティカルパスまとめ
md += `\n## クリティカルパス（最長経路: ${criticalPath.cost}h）\n\n`
md += '```text\n'
for (let i = 0; i < criticalPath.path.length; i++) {
  const t = taskMap.get(criticalPath.path[i])
  const indent = ' '.repeat(i)
  const arrow = i > 0 ? '→ ' : ''
  md += `${indent}${arrow}${t.id} ${t.name} (${t.adjusted}h)\n`
}
md += '```\n'

// 凡例
md += '\n## 凡例\n\n'
md += '| 色 | 意味 |\n'
md += '| --- | --- |\n'
md += '| 赤 | クリティカルパス（遅延でプロジェクト全体遅延） |\n'
md += '| グレー | 並行可能タスク |\n'
md += '| ==> 太線 | クリティカルパス上の依存 |\n'
md += '| -.-> 破線 | その他の依存 |\n'

writeFileSync(outPath, md)
console.log(`Generated: ${outPath}`)
console.log(`Critical path: ${criticalPath.path.join(' → ')} (${criticalPath.cost}h)`)
