import { ResumeDropzone } from '../components/dashboard/ResumeDropzone';
import { JobDescriptionPanel } from '../components/dashboard/JobDescriptionPanel';
import { RecentAssessments } from '../components/dashboard/RecentAssessments';

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-xl text-left font-body">
      {/* Header Block */}
      <div className="flex flex-col gap-xs select-none">
        <h2 className="font-headline font-bold text-headline-lg text-on-surface">
          Intake Hub
        </h2>
        <p className="text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
          Begin your path to career alignment. Upload your professional profile and target job description to pinpoint skill gaps and simulate custom interview rooms.
        </p>
      </div>

      {/* Bento Grid (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-stretch">
        {/* Resume upload (5 cols) */}
        <div className="lg:col-span-5 h-full">
          <ResumeDropzone />
        </div>
        
        {/* JD upload & analysis (7 cols) */}
        <div className="lg:col-span-7 h-full">
          <JobDescriptionPanel />
        </div>
      </div>

      {/* Divider */}
      <hr className="border-outline-variant/40" />

      {/* History section */}
      <RecentAssessments />
    </div>
  );
}
