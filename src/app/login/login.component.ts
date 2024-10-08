import { Component, OnInit } from '@angular/core'; // decorators e interfaces do angular
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; //formulários e reativos
import { Router } from '@angular/router'; // navegação
import { AuthService } from '../services/auth.service'; // serviço de auth

//interface para os dados de login
interface LoginData {
  comando: number;
  plataforma: number;
  versao: number;
  idDispositivo: string;
  login: string;
  senha: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  loginForm: FormGroup; // formulário reativo de login
  loginError: string | null = null; // erro para login
  loginHistory: LoginData[] = []; // Array para armazenar histórico de logins
  isModalOpen = false; //exibição do modal


  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
   //inicializa o formulário com campos de validação
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]], //campo de usuário obrigatório
      password: ['', [Validators.required]], // campo de senha obrigatório
      rememberMe: [false] //opção de lembre-se
    });
  }

  
  ngOnInit(): void {
    // carrega o usuário lembrado ao iniciar
    this.loadRememberedUser();
  }

  onFocus(): void {
    //limpa a mensagem de erro ao focar no campo em questão
    this.loginError = null;
  }

  onSubmit(): void {
    //verificar se o formulário é válido
    if (this.loginForm.valid) {
      const { username, password, rememberMe } = this.loginForm.value;
  
      // Define os dados a serem transmitidos para o login
      const loginData: LoginData = {
        comando: 240,
        plataforma: 3,
        versao: 1,
        idDispositivo: 'qualquer',
        login: username,
        senha: password
      };
  
      //chama o serviço de auth
      this.authService.login(username, password).subscribe(
        (response) => {
          console.log('Login bem-sucedido:', response);
          
          // Adiciona os dados do login ao histórico
          this.loginHistory.push(loginData);
  
          //verificar se a opção de lembre-se de mim está ativa
          if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
          } else {
            localStorage.removeItem('rememberedUser');
          }
  
          // Navegação para a entrada.component.html
          this.router.navigate(['/entrada']);
        },
        (error) => {
          console.error('Erro no login:', error);
          this.loginError = 'Usuário ou senha incorretos'; // mensagem de erro
        }
        
      );
    }
  }
  

  openModal(): void { // abre o modal (solicitação)
    this.isModalOpen = true;
  }

  closeModal(): void { //fecha o modal (solicitação)
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
