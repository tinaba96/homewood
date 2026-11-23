-- 掃除の状態: 途中まで（partial）と完了（done）を分ける。既存の記録はすべて完了
ALTER TABLE chores_done ADD COLUMN stage TEXT NOT NULL DEFAULT 'done' CHECK (stage IN ('partial', 'done'));
