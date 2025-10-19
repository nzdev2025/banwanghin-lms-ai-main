import { gradeStyles } from './theme';

export const grades = Object.keys(gradeStyles);

export const assignmentCategories = {
  quiz: { label: 'เก็บคะแนน', color: 'bg-sky-500/20 text-sky-300', borderColor: 'border-sky-500/30' },
  midterm: { label: 'สอบกลางภาค', color: 'bg-amber-500/20 text-amber-300', borderColor: 'border-amber-500/30' },
  final: { label: 'สอบปลายภาค', color: 'bg-rose-500/20 text-rose-300', borderColor: 'border-rose-500/30' },
};
