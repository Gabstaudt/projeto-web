import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { EntradaComponent } from './entrada/entrada.component';
import { HttpClientModule } from '@angular/common/http';
import { HistoricoModalComponent } from './historico-modal/historico-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import {FilterPipe} from '../filtro/filter.pipe';
import { GraficosModalComponent } from './graficos-modal/graficos-modal.component'


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    EntradaComponent,
    HistoricoModalComponent,
    FilterPipe,
    GraficosModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    MatDialogModule
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
