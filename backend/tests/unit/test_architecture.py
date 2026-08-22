"""Architecture boundary tests — verify hexagonal layer isolation.

These tests enforce that the core domain layer has ZERO dependencies
on infrastructure frameworks (FastAPI, SQLAlchemy, etc.). This is the
fundamental architectural invariant of hexagonal architecture.

If these tests fail, it means someone imported a framework into the
core domain, violating the dependency rule.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

# Forbidden imports in the core domain layer
FORBIDDEN_CORE_IMPORTS = {
    "fastapi",
    "sqlalchemy",
    "starlette",
    "pydantic",
    "uvicorn",
    "asyncpg",
    "alembic",
    "httpx",
}

# The core domain directory
CORE_DIR = Path(__file__).parent.parent.parent / "src" / "spill" / "core"


def _get_python_files(directory: Path) -> list[Path]:
    """Recursively find all .py files in a directory."""
    return list(directory.rglob("*.py"))


def _extract_imports(filepath: Path) -> list[str]:
    """Extract all import module names from a Python file using AST."""
    source = filepath.read_text(encoding="utf-8")
    tree = ast.parse(source, filename=str(filepath))

    imports: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module.split(".")[0])
    return imports


class TestHexagonalBoundaries:
    """Verify the core domain has no framework dependencies."""

    def test_core_directory_exists(self) -> None:
        """The core domain directory must exist."""
        assert CORE_DIR.exists(), f"Core directory not found: {CORE_DIR}"

    def test_core_has_no_framework_imports(self) -> None:
        """No file in core/ should import from infrastructure frameworks."""
        violations: list[str] = []

        for filepath in _get_python_files(CORE_DIR):
            imports = _extract_imports(filepath)
            for imp in imports:
                if imp in FORBIDDEN_CORE_IMPORTS:
                    relative = filepath.relative_to(CORE_DIR)
                    violations.append(f"{relative}: imports '{imp}'")

        assert violations == [], (
            f"Core domain has forbidden framework imports:\n"
            + "\n".join(f"  - {v}" for v in violations)
        )

    def test_core_entities_are_frozen_dataclasses(self) -> None:
        """Domain entities must be immutable (frozen=True)."""
        entities_dir = CORE_DIR / "entities"
        if not entities_dir.exists():
            pytest.skip("No entities directory")

        for filepath in _get_python_files(entities_dir):
            if filepath.name.startswith("_"):
                continue
            source = filepath.read_text(encoding="utf-8")
            tree = ast.parse(source, filename=str(filepath))

            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    for decorator in node.decorator_list:
                        if isinstance(decorator, ast.Call):
                            for keyword in decorator.keywords:
                                if keyword.arg == "frozen":
                                    assert isinstance(keyword.value, ast.Constant)
                                    assert keyword.value.value is True, (
                                        f"Entity {node.name} in {filepath.name} "
                                        f"must have frozen=True"
                                    )

    def test_ports_are_protocols(self) -> None:
        """Port interfaces must be typing.Protocol classes."""
        ports_dir = CORE_DIR / "ports"
        if not ports_dir.exists():
            pytest.skip("No ports directory")

        for filepath in _get_python_files(ports_dir):
            if filepath.name.startswith("_"):
                continue
            source = filepath.read_text(encoding="utf-8")
            if "class " in source and "__init__" not in filepath.name:
                assert "Protocol" in source, (
                    f"Port {filepath.name} should define Protocol classes"
                )

    def test_use_cases_only_depend_on_ports(self) -> None:
        """Use cases should import from core only, never from adapters."""
        use_cases_dir = CORE_DIR / "use_cases"
        if not use_cases_dir.exists():
            pytest.skip("No use_cases directory")

        for filepath in _get_python_files(use_cases_dir):
            if filepath.name.startswith("_"):
                continue
            imports = _extract_imports(filepath)
            for imp in imports:
                if imp in FORBIDDEN_CORE_IMPORTS:
                    relative = filepath.relative_to(CORE_DIR)
                    pytest.fail(
                        f"Use case {relative} imports framework '{imp}'"
                    )
