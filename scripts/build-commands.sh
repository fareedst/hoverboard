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
