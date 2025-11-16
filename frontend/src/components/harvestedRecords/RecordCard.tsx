import { Item, Icon, ItemExtra, Button, Grid, Label, Popup } from 'semantic-ui-react';
import { ActionButton } from './RecordButton';
import { useResolveRecord } from '../../hooks/recordMutations';

interface RecordCardProps {
  record: any;
}

const RecordCard = ({ record }: RecordCardProps) => {
  const statusColor = record.is_resolved ? 'green' : 'red';
  const { mutate: resolveRecord, isPending: isResolving } = useResolveRecord();

  const handleResolve = () => {
    resolveRecord(record);
  };

  const renderCurationFields = () => {
    const hasCurationData =
      (record.site_references && record.site_references.length > 0) ||
      (record.habitat_references && record.habitat_references.length > 0) ||
      record.dataset_type ||
      (record.keywords && record.keywords.length > 0);

    if (!hasCurationData) return null;

    const groups = [];

    if (record.site_references && record.site_references.length > 0) {
      groups.push(
        <Label.Group key="sites" size="small">
          <Icon name="map pin" size="small" />
          {record.site_references.map((site: any, idx: number) => (
            <Label key={idx}>{site.siteName || site.siteID || 'Unknown Site'}</Label>
          ))}
        </Label.Group>,
      );
    }

    if (record.habitat_references && record.habitat_references.length > 0) {
      groups.push(
        <Label.Group key="habitats" size="small">
          <Icon name="leaf" size="small" />
          {record.habitat_references.map((habitat: any, idx: number) => (
            <Label key={idx}>{habitat.soHabitatCode}</Label>
          ))}
        </Label.Group>,
      );
    }

    if (record.dataset_type) {
      groups.push(
        <Label.Group key="dataset-type" size="small">
          <Icon name="database" size="small" />
          <Label>{record.dataset_type.datasetTypeCode}</Label>
        </Label.Group>,
      );
    }

    if (record.keywords && record.keywords.length > 0) {
      groups.push(
        <Label.Group key="keywords" size="small">
          {record.keywords.slice(0, 6).map((keyword: any, idx: number) => (
            <Label key={idx}>{keyword.keywordLabel}</Label>
          ))}
          {record.keywords.length > 6 && (
            <Popup
              trigger={<Label>+{record.keywords.length - 6} more</Label>}
              content={record.keywords.slice(6).map((keyword: any, idx: number) => (
                <Label key={idx + 6} size="small">
                  {keyword.keywordLabel}
                </Label>
              ))}
              position="top center"
              on="hover"
            />
          )}
        </Label.Group>,
      );
    }

    return (
      <Item.Group style={{ textAlign: 'left' }}>
        {groups.map((group, idx) => (
          <div key={idx} style={{ textAlign: 'left' }}>
            {group}
          </div>
        ))}
      </Item.Group>
    );
  };

  return (
    <Item className="search-listing-item">
      <Item.Content>
        <Grid columns={2} verticalAlign="middle">
          <Grid.Column>
            <Item.Header>{record.title || 'No Title'}</Item.Header>
            <Item.Meta>
              <Icon name="linkify" size="small" />
              <a href={record.source_url}>{record.source_url}</a>
            </Item.Meta>
            {renderCurationFields()}
            {record.is_resolved && (
              <ItemExtra>
                <Icon name="check" color={statusColor} />
              </ItemExtra>
            )}
          </Grid.Column>
          <Grid.Column width={4} textAlign="right">
            <Button.Group vertical>
              <ActionButton record={record} />
              <Button
                color={record.is_resolved ? 'grey' : 'green'}
                onClick={handleResolve}
                disabled={isResolving}
                loading={isResolving}
              >
                <Icon name={record.is_resolved ? 'x' : 'check'} />
                {record.is_resolved ? 'Unresolve' : 'Resolve'}
              </Button>
            </Button.Group>
          </Grid.Column>
        </Grid>
      </Item.Content>
    </Item>
  );
};

export default RecordCard;
