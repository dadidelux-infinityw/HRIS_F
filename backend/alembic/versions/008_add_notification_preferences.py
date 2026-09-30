"""add notification preference columns to users table

Revision ID: 008
Revises: 007
Create Date: 2026-09-30
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # app/main.py may already have added these columns at startup
    columns = {c['name'] for c in sa.inspect(op.get_bind()).get_columns('users')}
    if 'notify_email' not in columns:
        op.add_column(
            'users',
            sa.Column('notify_email', sa.Boolean(), nullable=False, server_default=sa.true())
        )
    if 'notify_in_app' not in columns:
        op.add_column(
            'users',
            sa.Column('notify_in_app', sa.Boolean(), nullable=False, server_default=sa.true())
        )


def downgrade() -> None:
    op.drop_column('users', 'notify_in_app')
    op.drop_column('users', 'notify_email')
