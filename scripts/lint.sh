echo_exec ../../chatgpt/stdd/scripts/lint_yaml.sh -F tied && \
echo_exec ../../chatgpt/stdd/scripts/yaml_tool.sh --sort-lists --sort-keys -F tied && \
TIED_MCP_BIN=../../chatgpt/stdd/mcp-server/dist/index.js echo_exec ../../chatgpt/stdd/tools/bundled-tied-yaml-skill/scripts/tied-cli.sh tied_verify
