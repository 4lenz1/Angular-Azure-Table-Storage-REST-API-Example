import { TestBed } from '@angular/core/testing';

import { AzureTableStorageService } from './azure-table-storage.service';

describe('AzureTableStorageService', () => {
  let service: AzureTableStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AzureTableStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
