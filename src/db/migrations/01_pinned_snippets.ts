import { DataTypes } from 'sequelize';
const { INTEGER } = DataTypes;

export const up = async (context: any): Promise<void> => {
  // Check if column already exists
  const columns = await context.context.describeTable('snippets');
  if (!columns.isPinned) {
    await context.context.addColumn('snippets', 'isPinned', {
      type: INTEGER,
      allowNull: true,
      defaultValue: 0
    });
  }
};

export const down = async (context: any): Promise<void> => {
  await context.context.removeColumn('snippets', 'isPinned');
};
