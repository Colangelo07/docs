import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'

import { program } from 'commander'

import readFrontmatter from '#src/frame/lib/read-frontmatter.js'

const ROOT = process.env.ROOT || '.'
const CONTENT_ROOT = path.resolve(path.join(ROOT, 'content'))

program
  .description('Test that a file correctly got moved')
  .arguments('old', 'old file or folder name')
  .arguments('new', 'new file or folder name')
  .parse(process.argv)

main(program.args)

async function main(nameTuple) {
  const [before, after] = nameTuple
  assert(!fs.existsSync(before), `File or folder ${before} exists`)
  assert(fs.existsSync(after), `File or folder ${after} exists`)
  if (after.endsWith('.md')) {
    const fileContent = fs.readFileSync(after, 'utf-8')
    const { data } = readFrontmatter(fileContent)
    const oldHref = makeHref(CONTENT_ROOT, before)
    assert(data.redirect_from.includes(oldHref), `Redirect from ${oldHref} not found`)
    {
      const parentIndexMd = path.join(path.dirname(after), 'index.md')
      const fileContent = fs.readFileSync(parentIndexMd, 'utf-8')
      const { data } = readFrontmatter(fileContent)
      const afterShortname = '/' + after.split('/').slice(-1)[0].replace(/\.md$/, '')
      assert(data.children.includes(afterShortname), `Child ${afterShortname} not found`)
    }
  } else {
    const fileContent = fs.readFileSync(path.join(after, 'index.md'), 'utf-8')
    const { data } = readFrontmatter(fileContent)
    const oldHref = makeHref(CONTENT_ROOT, before)
    assert(data.redirect_from.includes(oldHref), `Redirect from ${oldHref} not found`)
    {
      const parentIndexMd = path.join(path.dirname(after), 'index.md')
      const fileContent = fs.readFileSync(parentIndexMd, 'utf-8')
      const { data } = readFrontmatter(fileContent)
      const afterShortname = '/' + after.split('/').slice(-1)
      assert(data.children.includes(afterShortname), `Child ${afterShortname} not found`)
    }
  }
}

function makeHref(root, filePath) {
  const nameSplit = path.relative(root, filePath).split(path.sep)
  if (nameSplit.slice(-1)[0] === 'index.md') {
    nameSplit.pop()
  } else {
    nameSplit.push(nameSplit.pop().replace(/\.md$/, ''))
  }
  return '/' + nameSplit.join('/')
}
