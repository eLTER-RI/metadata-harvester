import { Form, Input } from 'semantic-ui-react';

const JsonFormField = ({
  path,
  value,
  onDataChange,
}: {
  path: string;
  value: any;
  onDataChange: (path: string, value: any) => void;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange(path, e.target.value);
  };

  return (
    <Form.Field>
      <label>{path}</label>
      <Input value={value || ''} onChange={handleChange} />
    </Form.Field>
  );
};

const renderForm = (data: any, onDataChange: (path: string, value: any) => void, path = '') => {
  if (!data) return null;
  return Object.keys(data).map((key) => {
    const currentPath = path ? `${path}.${key}` : key;
    const value = data[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return;
    }

    if (Array.isArray(value)) {
      return;
    }

    return <JsonFormField key={currentPath} path={currentPath} value={value} onDataChange={onDataChange} />;
  });
};

export const JsonForm = ({ data, onDataChange }: { data: any; onDataChange: (path: string, value: any) => void }) => {
  return <Form>{renderForm(data, onDataChange)}</Form>;
};
