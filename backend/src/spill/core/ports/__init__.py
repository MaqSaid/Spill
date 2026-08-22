"""Ports — protocol interfaces for driven adapters."""

from spill.core.ports.id_generator import IdGenerator
from spill.core.ports.repository import SubmissionRepository

__all__ = ["SubmissionRepository", "IdGenerator"]
