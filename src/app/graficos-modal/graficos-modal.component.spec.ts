import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficosModalComponent } from './graficos-modal.component';

describe('GraficosModalComponent', () => {
  let component: GraficosModalComponent;
  let fixture: ComponentFixture<GraficosModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GraficosModalComponent]
    });
    fixture = TestBed.createComponent(GraficosModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
