# build-commands.sh

# TIED

alias tied-cli=.cursor/skills/tied-yaml/scripts/tied-cli.sh

lint-tied () {
  ../../chatgpt/stdd/scripts/lint_yaml.sh -F tied
}
alias lint-reorder=scripts/lint.sh

# echo_exec

export ECHO_EXEC_CMD=1
export ECHO_EXEC_TIME=1
export ECHO_EXEC_TIME_UTC='%H:%M:%S'

# bkpdir

alias bi='bkpdir inc'
alias b.='bkpdir .'

# Hoverboard

# Install dependencies
alias ni='echo_exec bun install'

# Build the extension
alias nb='echo_exec bun run build:dev'

# Run tests (Jest harness via package.json "test"; not bare `bun test` runner)
alias nt='echo_exec bun run test'
alias nj='echo_exec npx jest --no-coverage'

# Start development mode with hot reload
alias nr='echo_exec bun run dev'
