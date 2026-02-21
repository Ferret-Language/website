#!/usr/bin/env sh

set -eu

# Detect if running on Arch Linux
if [ ! -f /etc/arch-release ]; then
  echo "This installer is intended for Arch Linux." >&2
  exit 1
fi

DEST_DIR="${FERRET_INSTALL_DIR:-${HOME}/.local}"
FERRET_DIR="${DEST_DIR}/ferret"
BIN_DIR="${FERRET_DIR}/bin"

# Check if user wants system-wide install
if [ "${FERRET_INSTALL_DIR:-}" = "" ] && [ "$(id -u)" -eq 0 ]; then
  DEST_DIR="/usr/local"
  FERRET_DIR="${DEST_DIR}/ferret"
  BIN_DIR="${FERRET_DIR}/bin"
fi

cleanup_path() {
  path="$1"
  if [ -e "$path" ] || [ -L "$path" ]; then
    rm -rf "$path" 2>/dev/null || true
  fi
}

cleanup_stale_system_bin() {
  if [ -e "/usr/local/bin/ferret" ] || [ -L "/usr/local/bin/ferret" ]; then
    if [ -L "/usr/local/bin/ferret" ] && [ ! -e "/usr/local/bin/ferret" ]; then
      cleanup_path "/usr/local/bin/ferret"
    elif [ -e "${BIN_DIR}/ferret" ] && [ ! "/usr/local/bin/ferret" -ef "${BIN_DIR}/ferret" ]; then
      cleanup_path "/usr/local/bin/ferret"
    fi

    if [ -e "/usr/local/bin/ferret" ] || [ -L "/usr/local/bin/ferret" ]; then
      if [ ! -w "/usr/local/bin/ferret" ]; then
        echo "Warning: /usr/local/bin/ferret exists and could not be removed (permission denied)."
        echo "  Remove with: sudo rm -f /usr/local/bin/ferret"
      else
        echo "Warning: /usr/local/bin/ferret exists and may shadow this install."
      fi
    fi
  fi
}

echo "Installing Ferret to ${FERRET_DIR}"

# Detect architecture
ARCH=$(uname -m)
case "${ARCH}" in
  x86_64)
    FERRET_ARCH="linux-amd64"
    ;;
  aarch64|arm64)
    FERRET_ARCH="linux-arm64"
    ;;
  *)
    echo "Unsupported architecture: ${ARCH}" >&2
    exit 1
    ;;
esac

# Get latest release URL
RELEASE_URL="https://api.github.com/repos/Ferret-Language/Ferret/releases/latest"
echo "Fetching latest release..."

# Download release info and extract download URL for our architecture
DOWNLOAD_URL=$(curl -sL "${RELEASE_URL}" | grep "browser_download_url.*${FERRET_ARCH}.tar.gz" | cut -d '"' -f 4)

if [ -z "${DOWNLOAD_URL}" ]; then
  echo "Error: Could not find ${FERRET_ARCH} release" >&2
  echo "Available releases: https://github.com/Ferret-Language/Ferret/releases/latest" >&2
  exit 1
fi

echo "Downloading ${DOWNLOAD_URL}..."

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

# Remove previous Ferret install (keep other tools in DEST_DIR/bin)
rm -rf "${FERRET_DIR}"
rm -f "${DEST_DIR}/bin/ferret"
rm -rf "${DEST_DIR}/libs" "${DEST_DIR}/toolchain"

# Download and extract
cd "${TEMP_DIR}"
curl -L -o ferret.tar.gz "${DOWNLOAD_URL}"
tar -xzf ferret.tar.gz

# Install to destination
mkdir -p "${FERRET_DIR}/bin"
mkdir -p "${FERRET_DIR}/libs"

# Copy binary
if [ -f "ferret/bin/ferret" ]; then
  cp -f ferret/bin/ferret "${FERRET_DIR}/bin/"
elif [ -f "bin/ferret" ]; then
  cp -f bin/ferret "${FERRET_DIR}/bin/"
elif [ -f "ferret" ]; then
  cp -f ferret "${FERRET_DIR}/bin/"
else
  echo "Error: ferret binary not found in extracted archive" >&2
  exit 1
fi

chmod +x "${FERRET_DIR}/bin/ferret"

# Copy runtime libraries and toolchain (must live at ../libs and ../toolchain relative to bin)
if [ -d "ferret/libs" ]; then
  cp -r ferret/libs/* "${FERRET_DIR}/libs/"
elif [ -d "libs" ]; then
  cp -r libs/* "${FERRET_DIR}/libs/"
fi
if [ -d "ferret/toolchain" ]; then
  cp -r ferret/toolchain "${FERRET_DIR}/"
elif [ -d "toolchain" ]; then
  cp -r toolchain "${FERRET_DIR}/"
fi

cleanup_stale_system_bin

echo ""
echo "✓ Ferret installed successfully to ${FERRET_DIR}"
echo ""

# Check if in PATH
add_path_line() {
  file="$1"
  line="export PATH=\"${BIN_DIR}:\$PATH\""
  if [ -f "$file" ]; then
    if grep -qs "$line" "$file"; then
      return 0
    fi
  fi
  printf '\n%s\n' "$line" >> "$file"
}

shell_name="$(basename "${SHELL:-}")"
if [ "$shell_name" = "zsh" ]; then
  add_path_line "${HOME}/.zshrc"
elif [ "$shell_name" = "bash" ]; then
  add_path_line "${HOME}/.bashrc"
fi
add_path_line "${HOME}/.profile"

if echo "${PATH}" | grep -q "${BIN_DIR}"; then
  echo "✓ ${BIN_DIR} is already in your PATH"
  echo "  Run: ferret --version"
else
  echo "Added ${BIN_DIR} to PATH in your shell profile."
  echo "Restart your terminal to use 'ferret'."
fi
