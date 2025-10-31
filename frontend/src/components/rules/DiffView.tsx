import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

interface DiffViewProps {
  oldValue: any;
  newValue: any;
  splitView?: boolean;
}

function toDiffView(value: any) {
  if (value === undefined) return '';
  if (value === null) return '';

  try {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return JSON.stringify(value);
    }
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export const DiffView = ({ oldValue, newValue, splitView = true }: DiffViewProps) => {
  const oldStr = toDiffView(oldValue);
  const newStr = toDiffView(newValue);
  return (
    <ReactDiffViewer
      oldValue={oldStr}
      newValue={newStr}
      splitView={splitView}
      hideLineNumbers
      compareMethod={DiffMethod.WORDS}
      leftTitle="Previous"
      rightTitle="Current"
      styles={{
        diffContainer: { fontSize: '0.85em' },
        contentText: { textAlign: 'left' },
      }}
    />
  );
};
