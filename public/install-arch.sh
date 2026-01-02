#!/usr/bin/env sh

set -eu

# Detect if running on Arch Linux
if [ ! -f /etc/arch-release ]; then
  echo "This installer is intended for Arch Linux." >&2
  exit 1
fi

REPO="${FERRET_REPO:-https://github.com/Ferret-Language/Ferret.git}"
REF="${FERRET_REF:-stable}"
SRC_DIR="${FERRET_SRC_DIR:-${HOME}/.local/src/Ferret}"
DEST_DIR="${FERRET_INSTALL_DIR:-${HOME}/.local}"

# Check if user wants system-wide install
if [ "${FERRET_INSTALL_DIR:-}" = "" ] && [ "$(id -u)" -eq 0 ]; then
  DEST_DIR="/usr/local"
fi

echo "Installing Ferret to ${DEST_DIR}"

# Install dependencies via pacman (requires sudo if not root)
if [ "$(id -u)" -eq 0 ]; then
  pacman -S --needed --noconfirm base-devel git go clang binutils
else
  echo "Note: This script may need sudo privileges to install packages."
  echo "Installing dependencies..."
  if ! sudo pacman -S --needed --noconfirm base-devel git go clang binutils 2>/dev/null; then
    echo "Warning: Could not install packages. Please install manually:" >&2
    echo "  sudo pacman -S base-devel git go clang binutils" >&2
    echo "Continuing anyway..." >&2
  fi
fi

# Clone or update repository
if [ -d "${SRC_DIR}/.git" ]; then
  git -C "${SRC_DIR}" fetch --depth 1 --tags origin "${REF}" || true
  git -C "${SRC_DIR}" reset --hard "origin/${REF}"
else
  mkdir -p "$(dirname "${SRC_DIR}")"
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
echo "✓ Installation complete!"
