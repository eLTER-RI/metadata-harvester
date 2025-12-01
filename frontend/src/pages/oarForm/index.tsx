import { Container } from 'semantic-ui-react';
import { OarForm } from '../../components/oar/OarForm';

export const OarFormPage = () => {
  return (
    <Container>
      <OarForm asModal={false} />
    </Container>
  );
};
