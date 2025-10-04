import { Suspense } from 'react';
import AeroschoolLearning from '@/components/aeroschool-style-learning';

export default function LearningPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <AeroschoolLearning />
      </Suspense>
    </div>
  );
}

