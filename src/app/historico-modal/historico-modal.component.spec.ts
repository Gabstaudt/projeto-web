import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricoModalComponent } from './historico-modal.component';

describe('HistoricoModalComponent', () => {
  let component: HistoricoModalComponent;
  let fixture: ComponentFixture<HistoricoModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HistoricoModalComponent]
    });
    fixture = TestBed.createComponent(HistoricoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
