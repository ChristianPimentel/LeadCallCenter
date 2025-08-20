export type CallStatus = 'Called' | 'Voicemail' | 'Missed Call' | 'Not Called';

export type CallRecord = {
  status: CallStatus;
  timestamp: string;
};

export type Student = {
  id: string;
  name: string;
  phone: string;
  email: string;
  groupId: string;
  callHistory: CallRecord[];
};

export type Group = {
  id: string;
  name: string;
};
