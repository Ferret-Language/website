#!/usr/bin/env sh
set -eu

if [ -z "${TERMUX_VERSION-}" ] && [ "${PREFIX:-}" != "/data/data/com.termux/files/usr" ]; then
  echo "This installer is intended for Termux." >&2
  exit 1
fi

REPO="${FERRET_REPO:-https://github.com/Ferret-Language/Ferret.git}"
REF="${FERRET_REF:-stable}"
SRC_DIR="${FERRET_SRC_DIR:-${HOME}/Ferret}"
DEST_DIR="${FERRET_INSTALL_DIR:-${PREFIX:-/data/data/com.termux/files/usr}}"

pkg update -y
pkg upgrade -y
pkg install -y git golang clang binutils libxml2

if [ -d "${SRC_DIR}/.git" ]; then
  git -C "${SRC_DIR}" fetch --depth 1 --tags origin "${REF}"
  git -C "${SRC_DIR}" reset --hard "origin/${REF}"
else
  git clone --depth 1 --branch "${REF}" "${REPO}" "${SRC_DIR}"
fi

cd "${SRC_DIR}"

# Clean previous builds for fresh install
echo "Cleaning previous builds..."
rm -rf bin/ libs/ gen/ gen_debug/ gen_keep/

# Set environment for bootstrap
export FERRET_INSTALL_DIR="${DEST_DIR}"
export CC=clang

echo "Building Ferret..."
go run tools/main.go
echo ""
# Check if installed to default Termux location (which is in PATH by default)
default_prefix="/data/data/com.termux/files/usr"
if [ "${DEST_DIR}" = "${PREFIX:-${default_prefix}}" ] || [ "${DEST_DIR}" = "${default_prefix}" ]; then
  echo "✓ The 'ferret' command should be available now (${DEST_DIR}/bin is in PATH by default in Termux)"
  echo "  If 'ferret' doesn't work, try: exec \$SHELL"
else
  echo "To use the 'ferret' command, add to your PATH:"
  echo "  export PATH=\"${DEST_DIR}/bin:\$PATH\""
  echo "Or add to ~/.bashrc:"
  echo "  echo 'export PATH=\"${DEST_DIR}/bin:\$PATH\"' >> ~/.bashrc"
fi
