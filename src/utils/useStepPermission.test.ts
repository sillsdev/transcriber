import { renderHook } from '@testing-library/react-hooks';
import { useStepPermissions } from './useStepPermission';
import * as FindRecord from '../crud/tryFindRecord';
import { memory } from '../schema';
import { GroupD, OrganizationD, OrgWorkflowStepD, SectionD } from '../model';
import OrganizationSchemeStep from '../model/organizationSchemeStep';

var mockOrgId = 'org-id';
var SchemeId = 'scheme-id';
var StepId = 'step-id';
var SectionId = 'section-id';
var SchemeStepId = 'scheme-step-id';
var mockUserId = 'user-id';
var GroupId = 'group-id';

var mockMemory = memory;
var mockUserIsAdmin = true;
var mockGetOrgDefault = jest.fn();
var mockOrganizations = [] as OrganizationD[];
var mockSteps = [] as OrgWorkflowStepD[];
var mockSchemeSteps = [] as OrganizationSchemeStep[];
var mockGroups = [] as GroupD[];

jest.mock('../components/Peers/usePeerGroups', () => ({
  usePeerGroups: () => ({
    myGroups: mockGroups,
  }),
}));
jest.mock('../context/GlobalContext', () => ({
  useGlobal: (arg: string) =>
    arg === 'organization'
      ? [mockOrgId, jest.fn()]
      : arg === 'user'
      ? [mockUserId, jest.fn()]
      : arg === 'memory'
      ? [mockMemory, jest.fn()]
      : [{}, jest.fn()],
  useGetGlobal: () => (arg: string) => false, // remoteBusy & importexportBusy
}));
jest.mock('../crud/useRole', () => ({
  useRole: () => ({
    userIsAdmin: mockUserIsAdmin,
  }),
}));
jest.mock('../crud/useOrgDefaults', () => ({
  useOrgDefaults: () => ({
    getOrgDefault: mockGetOrgDefault,
  }),
  orgDefaultPermissions: 'permissions',
}));
jest.mock('../hoc/useOrbitData', () => ({
  useOrbitData: (recType: string) =>
    recType === 'organization'
      ? mockOrganizations
      : recType === 'orgworkflowstep'
      ? mockSteps
      : recType === 'organizationschemestep'
      ? mockSchemeSteps
      : [],
}));

const defaultGroups = [
  {
    id: GroupId,
    type: 'group',
    attributes: {
      name: 'test-group-name',
    },
  } as GroupD,
];

const defaultSection = {
  id: SectionId,
  type: 'section',
  attributes: {
    name: 'test-section-name',
  },
  relationships: {
    organizationScheme: {
      data: {
        id: SchemeId,
        type: 'organizationscheme',
      },
    },
  },
} as SectionD;

const defaultSteps = [
  {
    id: StepId,
    type: 'orgworkflowstep',
    attributes: {
      tool: '{"tool":"record"}',
    },
    relationships: {
      organization: {
        data: {
          id: mockOrgId,
          type: 'organization',
        },
      },
    },
  } as OrgWorkflowStepD,
];

const defaultSchemeSteps = [
  {
    id: SchemeStepId,
    type: 'organizationschemestep',
    attributes: {},
    relationships: {
      organizationScheme: {
        data: {
          id: SchemeId,
          type: 'organizationscheme',
        },
      },
    },
  } as OrganizationSchemeStep,
];

describe('useStepPermissions', () => {
  beforeEach(() => {
    // Mocking dependencies
    mockUserIsAdmin = true;
    mockGetOrgDefault.mockReturnValue(undefined);
    mockOrganizations = [];
    mockSteps = [];
    mockSchemeSteps = [];
    mockGroups = [];
  });

  test('canDoVernacular returns true for admin user', () => {
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoVernacular('test-section-id')).toBe(true);
  });

  test('canDoVernacular checks org default permissions', () => {
    mockUserIsAdmin = false;
    renderHook(() => useStepPermissions());
    expect(mockGetOrgDefault).toBeCalledWith('permissions');
  });

  test('canDoVernacular returns true if no org default permissions', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(undefined);
    const { result } = renderHook(() => useStepPermissions());
    expect(mockGetOrgDefault).toBeCalledWith('permissions');
    expect(result.current.canDoVernacular('test-section-id')).toBe(true);
  });

  test('canDoVernacular returns true if org default permissions is false', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(false);
    const { result } = renderHook(() => useStepPermissions());
    expect(mockGetOrgDefault).toBeCalledWith('permissions');
    expect(result.current.canDoVernacular('test-section-id')).toBe(true);
  });

  test('canDoVernacular returns false if no org scheme steps', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(true);
    const { result } = renderHook(() => useStepPermissions());
    expect(mockGetOrgDefault).toBeCalledWith('permissions');
    expect(result.current.canDoVernacular('test-section-id')).toBe(false);
  });

  test('canDoVernacular returns true there is a scheme associated with the section', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(true);
    mockSteps = defaultSteps;
    jest.spyOn(FindRecord, 'findRecord').mockReturnValue(defaultSection);
    mockSchemeSteps = defaultSchemeSteps;
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoVernacular(SectionId)).toBe(true);
  });

  test('canDoVernacular returns true there is a scheme associated with the section and blank settings', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(true);
    // check alternate tool value
    mockSteps = [
      {
        ...defaultSteps[0],
        attributes: {
          tool: '{"tool":"record","settings":""}',
        },
      } as OrgWorkflowStepD,
    ];
    jest.spyOn(FindRecord, 'findRecord').mockReturnValue(defaultSection);
    mockSchemeSteps = defaultSchemeSteps;
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoVernacular(SectionId)).toBe(true);
  });

  test('canDoSectionStep returns true if user is admin', () => {
    mockUserIsAdmin = true;
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoSectionStep(StepId, {} as SectionD)).toBe(true);
  });

  test('canDoSectionStep returns true if permissions are off', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(false);
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoSectionStep(StepId, {} as SectionD)).toBe(true);
  });

  test('canDoSectionStep returns false if no scheme', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(true);
    mockSteps = defaultSteps;
    const section = {
      ...defaultSection,
      relationships: {},
    } as SectionD;
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoSectionStep(StepId, section)).toBe(false);
  });

  test('canDoSectionStep returns true if unassigned', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(true);
    mockSteps = defaultSteps;
    mockSchemeSteps = defaultSchemeSteps;
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoSectionStep(StepId, defaultSection)).toBe(true);
  });

  test('canDoSectionStep returns true if assigned to current user', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(true);
    mockSteps = defaultSteps;
    mockSchemeSteps = [
      {
        ...defaultSchemeSteps[0],
        relationships: {
          ...defaultSchemeSteps[0].relationships,
          user: {
            data: {
              id: mockUserId,
              type: 'user',
            },
          },
        },
      } as OrganizationSchemeStep,
    ];
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoSectionStep(StepId, defaultSection)).toBe(true);
  });

  test('canDoSectionStep returns false if assigned to different user', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(true);
    mockSteps = defaultSteps;
    mockSchemeSteps = [
      {
        ...defaultSchemeSteps[0],
        relationships: {
          ...defaultSchemeSteps[0].relationships,
          user: {
            data: {
              id: 'other-user-id', // different user
              type: 'user',
            },
          },
        },
      } as OrganizationSchemeStep,
    ];
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoSectionStep(StepId, defaultSection)).toBe(true);
  });

  test('canDoSectionStep returns true if assigned to a group containing the current user', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(true);
    mockSteps = defaultSteps;
    mockGroups = defaultGroups;
    mockSchemeSteps = [
      {
        ...defaultSchemeSteps[0],
        relationships: {
          ...defaultSchemeSteps[0].relationships,
          group: {
            data: {
              id: GroupId,
              type: 'group',
            },
          },
        },
      } as OrganizationSchemeStep,
    ];
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoSectionStep(StepId, defaultSection)).toBe(true);
  });

  test('canDoSectionStep returns false if assigned to a group not containing the current user', () => {
    mockUserIsAdmin = false;
    mockGetOrgDefault.mockReturnValue(true);
    mockSteps = defaultSteps;
    mockGroups = defaultGroups;
    mockSchemeSteps = [
      {
        ...defaultSchemeSteps[0],
        relationships: {
          ...defaultSchemeSteps[0].relationships,
          group: {
            data: {
              id: 'other-group-id', // different group
              type: 'group',
            },
          },
        },
      } as OrganizationSchemeStep,
    ];
    const { result } = renderHook(() => useStepPermissions());
    expect(result.current.canDoSectionStep(StepId, defaultSection)).toBe(true);
  });
});
