import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetadataView } from './MetadataView';
import { wrapperBuilder } from './data/wrapperBuilder';

describe('MetadataView', () => {
  it('renders wrapper data in tree view', () => {
    const wrapper = wrapperBuilder({
      genName: 'TestBuilder',
      genVersion: '1.0.0',
      version: '0.0.1',
      name: 'Test Wrapper',
      abbreviation: 'TEST',
      description: 'Test description',
      burritos: [
        {
          id: 'test-burrito',
          path: 'test/',
          role: 'testRole',
        },
      ],
    });

    render(<MetadataView wrapper={wrapper} />);

    // Check for main sections
    expect(
      screen.getByText('format: scripture burrito wrapper')
    ).toBeInTheDocument();
    expect(screen.getByText('meta')).toBeInTheDocument();
    expect(screen.getByText('contents')).toBeInTheDocument();

    // Check for specific values in meta section
    expect(screen.getByText('version: 0.0.1')).toBeInTheDocument();
    expect(screen.getByText('name: TestBuilder')).toBeInTheDocument();
    expect(screen.getByText('version: 1.0.0')).toBeInTheDocument();

    // Check for specific values in identification section
    expect(screen.getByText('en: Test Wrapper')).toBeInTheDocument();
    expect(screen.getByText('en: TEST')).toBeInTheDocument();
    expect(screen.getByText('en: Test description')).toBeInTheDocument();

    // Check for specific values in contents section
    expect(screen.getByText('id: test-burrito')).toBeInTheDocument();
    expect(screen.getByText('path: test/')).toBeInTheDocument();
    expect(screen.getByText('role: testRole')).toBeInTheDocument();
  });
});
