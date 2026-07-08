-- Ràng buộc UNIQUE cần cho ON CONFLICT khi import điểm (upsert)
ALTER TABLE exam_results
  ADD CONSTRAINT exam_results_student_course_date_key UNIQUE (student_id, course_id, exam_date);
