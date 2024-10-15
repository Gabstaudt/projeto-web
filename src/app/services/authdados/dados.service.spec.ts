import { TestBed } from '@angular/core/testing';

import { TerceiraRequisicaoService } from './dados.service';

describe('TerceiraRequisicaoService', () => {
  let service: TerceiraRequisicaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TerceiraRequisicaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
