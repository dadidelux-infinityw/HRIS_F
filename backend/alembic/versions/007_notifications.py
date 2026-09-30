"""add notifications table

Revision ID: 007
Revises: 006
Create Date: 2026-09-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # app/main.py create_all may already have created the table at startup;
    # in that case only add any missing indexes
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table('notifications'):
        existing = {ix['name'] for ix in inspector.get_indexes('notifications')}
        if 'ix_notifications_user_id' not in existing:
            op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
        if 'ix_notifications_created_at' not in existing:
            op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])
        return

    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            'user_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.String(1000), nullable=False),
        sa.Column('link', sa.String(255), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_notifications_created_at', table_name='notifications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')
