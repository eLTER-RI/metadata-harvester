import React, { useEffect, useState } from 'react';
import { Container, Header, Item } from 'semantic-ui-react';
import { RecordCard } from './recordCard';
import axios from 'axios';
import { title } from 'process';

interface Record {
  dar_id: string;
  source_url: string;
  title: string;
}

export const RecordsList = () => {

  return (
    <div></div>
  );
};

export default RecordsList;
