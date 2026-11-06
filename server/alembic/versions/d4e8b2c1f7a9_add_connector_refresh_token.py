"""add connector refresh token

Revision ID: d4e8b2c1f7a9
Revises: c3f1a9d2e4b6
Create Date: 2026-11-06 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e8b2c1f7a9"
down_revision: Union[str, Sequence[str], None] = "c3f1a9d2e4b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "user_connectors",
        sa.Column("refresh_token", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )
    op.add_column(
        "user_connectors",
        sa.Column("token_expires_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("user_connectors", "token_expires_at")
    op.drop_column("user_connectors", "refresh_token")
