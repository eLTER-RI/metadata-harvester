import { useFormContext, Path } from 'react-hook-form';
import { Form } from 'semantic-ui-react';
import { CommonDatasetMetadata } from '../../../../../../src/store/commonStructure';

interface CoordinateInputProps {
  name: Path<CommonDatasetMetadata>;
  label: string;
  placeholder: string;
  required?: boolean;
}

export const CoordinateInput = ({ name, label, placeholder, required = false }: CoordinateInputProps) => {
  const { register } = useFormContext<CommonDatasetMetadata>();

  return (
    <Form.Field required={required}>
      <label>{label}</label>
      <Form.Input
        type="number"
        step="0.000001"
        placeholder={placeholder}
        {...register(name, { valueAsNumber: true })}
      />
    </Form.Field>
  );
};
