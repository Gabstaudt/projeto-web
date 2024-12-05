import { Component, OnInit } from '@angular/core'; // decorators e interfaces do angular
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; //formulários e reativos
import { Router } from '@angular/router'; // navegação
import { AuthService } from '../services/auth.service'; 
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

//interface para os dados de login
interface LoginData {
  comando: number;
  plataforma: number;
  versao: number;
  idDispositivo: string;
  login: string;
  senha: string;
}

interface LoginResponse {
  respostaOK: number;
  IdUsuario: number;
  NomeUsuario: string;
  PrivilegioUsuario: number;
  UnidadeUsuario: number;
  AcessoProducao: number;
  AcessoEmpresa1: number;
  AcessoEmpresa2: number;
  SessaoID: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  loginForm: FormGroup; 
  loginError: string | null = null; // erro para login
  loginHistory: LoginData[] = []; // Array para armazenar histórico de logins
  isModalOpen = false; 
  isLoading: boolean = false; // indicador de carregamento
  respostaOK: number | null = null; // variável para armazenar a resposta do servidor


  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]], 
      password: ['', [Validators.required]], 
      rememberMe: [false] //opção de lembre-se
    });
  }

  
  ngOnInit(): void {
    // carrega o usuário lembrado ao iniciar
    this.loadRememberedUser();
  }

  onFocus(): void {
    this.loginError = null;
    }
  

    onSubmit(): void {
      if (this.loginForm.valid) {
        const { username, password, rememberMe } = this.loginForm.value;
  
        // Inicia a animação de carregamento
        this.isLoading = true;
  
        this.authService.login(username, password)
          .pipe(
            catchError(error => {
              console.error('Erro ao alcançar o servidor no LoginComponent:', error);
              this.loginError = 'Erro ao alcançar o servidor. Por favor, tente novamente mais tarde.';
              this.isLoading = false;
              return throwError(() => error);
            })
          )
          .subscribe({
            next: (response: LoginResponse) => {
              // Finaliza a animação de carregamento após receber resposta
              this.isLoading = false;
  
          
  
              if (response && typeof response.respostaOK !== 'undefined') {
                this.respostaOK = response.respostaOK;
  
                // Tratamento baseado no valor da resposta
                switch (this.respostaOK) {
                  case 0:
                    this.loginError = 'Usuário ou senha incorretos.';
                    break;
                  case 1:
                    console.log('Login bem-sucedido no LoginComponent:', response);
                    if (rememberMe) {
                      localStorage.setItem('rememberedUser', username);
                    } else {
                      localStorage.removeItem('rememberedUser');
                    }
                    this.router.navigate(['/entrada']);
                    break;
                  case 2:
                    this.loginError = 'Usuário já está logado.';
                    break;
                  case 3:
                    this.loginError = 'Usuário sem permissão para acessar o sistema.';
                    break;
                  default:
                    this.loginError = 'Erro desconhecido. Por favor, tente novamente.';
                    break;
                }
              } else {
                console.error('Resposta inválida recebida no LoginComponent:', response);
                this.loginError = 'Erro ao conectar ao servidor. Por favor, tente novamente mais tarde.';
              }
            },
            error: (error) => {
              this.loginError = 'Erro ao conectar ao servidor. Por favor, tente novamente mais tarde.';
              this.isLoading = false;
            }
          });
      }
    }

  openModal(): void { 
    this.isModalOpen = true;
  }

  closeModal(): void { 
    this.isModalOpen = false;
  }


  private loadRememberedUser(): void {
    //carrega o usuário salvo no localStorage
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      //preenche o formulário com o usuário lembrado
      this.loginForm.patchValue({ username: rememberedUser, rememberMe: true });
    }
  }
}
