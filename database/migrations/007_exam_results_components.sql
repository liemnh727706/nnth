-- Điểm thành phần cho kết quả thi:
-- theory_score: điểm trắc nghiệm; practice_scores: [{name, score}] nhiều thành phần tùy môn
ALTER TABLE exam_results
  ADD COLUMN IF NOT EXISTS theory_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS practice_scores JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS total_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS result VARCHAR(30);
