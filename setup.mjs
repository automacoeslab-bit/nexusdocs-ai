import { createInterface } from 'readline'
import { spawnSync } from 'child_process'

const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve))
}

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    let value = ''
    process.stdin.on('data', function handler(char) {
      char = char.toString()
      if (char === '\r' || char === '\n') {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', handler)
        process.stdout.write('\n')
        resolve(value)
      } else if (char === '') {
        process.exit()
      } else if (char === '') {
        value = value.slice(0, -1)
      } else {
        value += char
      }
    })
  })
}

async function validateGitHubToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'nexusdocs-setup' },
  })
  if (!res.ok) return null
  return (await res.json()).login
}

async function validateVercelToken(token) {
  const res = await fetch('https://api.vercel.com/v2/user', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok
}

function setSecret(repo, name, value) {
  const result = spawnSync('gh', ['secret', 'set', name, '--repo', repo, '--body', value], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  if (result.status !== 0) {
    throw new Error(`Erro ao criar secret ${name}: ${result.stderr.toString().trim()}`)
  }
}

async function main() {
  console.log('\n=== NexusDocs Setup ===\n')
  console.log('Pré-requisito: gh CLI instalado e autenticado na conta do repo.\n')

  const ghToken = await askHidden('Token GitHub (escopos: repo + workflow): ')
  const ghUser = await validateGitHubToken(ghToken)
  if (!ghUser) {
    console.error('\nToken GitHub inválido. Verifique os escopos e tente novamente.')
    process.exit(1)
  }
  console.log(`Token GitHub válido — conta: ${ghUser}`)

  const repoInput = await ask('Repositório nexusdocs (ex: minha-org/nexusdocs-ai): ')
  const repo = repoInput.trim()
  if (!repo.includes('/')) {
    console.error('Formato inválido. Use: org/repo')
    process.exit(1)
  }

  const docsToken = await askHidden('Token para ler o docs-notion (Enter = usar o mesmo): ')
  const finalDocsToken = docsToken.trim() || ghToken

  const vercelToken = await askHidden('Token Vercel: ')
  const vercelOk = await validateVercelToken(vercelToken)
  if (!vercelOk) {
    console.error('\nToken Vercel inválido. Verifique e tente novamente.')
    process.exit(1)
  }
  console.log('Token Vercel válido.')

  const vercelOrgId = await ask('Vercel Account ID: ')
  const vercelProjectId = await ask('Vercel Project ID: ')

  console.log('\nConfigurando secrets...')
  try {
    setSecret(repo, 'DOCS_NOTION_TOKEN', finalDocsToken)
    console.log('✓ DOCS_NOTION_TOKEN')
    setSecret(repo, 'VERCEL_TOKEN', vercelToken)
    console.log('✓ VERCEL_TOKEN')
    setSecret(repo, 'VERCEL_ORG_ID', vercelOrgId.trim())
    console.log('✓ VERCEL_ORG_ID')
    setSecret(repo, 'VERCEL_PROJECT_ID', vercelProjectId.trim())
    console.log('✓ VERCEL_PROJECT_ID')
  } catch (err) {
    console.error(`\n${err.message}`)
    process.exit(1)
  }

  const trigger = await ask('\nDisparar o primeiro deploy agora? (s/n): ')
  if (trigger.trim().toLowerCase() === 's') {
    const result = spawnSync('gh', ['workflow', 'run', 'deploy.yml', '--repo', repo], {
      stdio: 'inherit',
    })
    if (result.status === 0) {
      console.log(`\nDeploy disparado! Acompanhe em: https://github.com/${repo}/actions`)
    } else {
      console.log('\nNão foi possível disparar. Acesse GitHub Actions e execute manualmente.')
    }
  }

  console.log('\nSetup concluído!')
  rl.close()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
