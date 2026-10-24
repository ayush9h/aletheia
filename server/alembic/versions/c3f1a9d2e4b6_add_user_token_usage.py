"""add user token usage

Revision ID: c3f1a9d2e4b6
Revises: 7e27d0e1d1b7
Create Date: 2026-10-24 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3f1a9d2e4b6"
down_revision: Union[str, Sequence[str], None] = "7e27d0e1d1b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "user_token_usage",
        sa.Column("user_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("period", sa.Date(), nullable=False),
        sa.Column("tokens_used", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("user_id", "period"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("user_token_usage")
