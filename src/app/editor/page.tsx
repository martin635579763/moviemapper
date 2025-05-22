
"use client"; // Required for context and client-side interactions

import { LayoutProvider } from '@/contexts/LayoutContext';
import { AppToolbar } from '@/components/AppToolbar';
import { LayoutEditor } from '@/components/LayoutEditor';
import { LayoutPreview } from '@/components/LayoutPreview';

export default function EditorPage() {
  return (
    <LayoutProvider>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <AppToolbar />
        <main className="flex flex-1 overflow-auto p-2 gap-2">
          <div className="flex-grow w-2/3"> {/* Editor takes more space by default */}
            <LayoutEditor />
          </div>
          <div className="flex-grow w-1/3"> {/* Preview takes less space */}
            <LayoutPreview />
          </div>
        </main>
      </div>
    </LayoutProvider>
  );
}
