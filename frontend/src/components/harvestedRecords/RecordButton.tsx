import { Dropdown } from 'semantic-ui-react';

interface ActionButtonProps {
  darId: string;
}

export const ActionButton = ({ darId }: ActionButtonProps) => {
  return (
    <Dropdown text="Actions" icon="list" floating labeled button className="icon">
      <Dropdown.Menu>
        <Dropdown.Item key={'edit'} icon={'edit'} text="Edit" />
        <Dropdown.Item key={'resolve'} icon={'check'} text="Resolve" />
        <Dropdown.Item
          key={'detail'}
          icon={'eye'}
          text="Detail"
          href={`https://dar.elter-ri.eu/external-datasets/${darId}`}
          target="_blank"
          rel="noopener noreferrer"
        />
      </Dropdown.Menu>
    </Dropdown>
  );
};
