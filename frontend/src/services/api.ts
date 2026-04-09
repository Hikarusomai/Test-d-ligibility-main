// src/services/api.ts

const getApiBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;
    
    // Auto-fallback to localhost if we are in dev mode
    if (window.location.hostname === 'localhost') {
        return 'http://localhost:3000/api';
    }
    
    return 'https://hackspice-backend.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API Service using URL:', API_BASE_URL);

export type QuestionType = 'number' | 'boolean' | 'single_choice' | 'multi_choice' | 'text';

export interface Question {
    _id: string;
    label?: string;
    labelEn?: string;
    text?: string;
    textEn?: string;
    key: string;
    category: string;
    type: QuestionType;
    options?: string[];
    optionsEn?: string[];
    weight: number;
    isRequired: boolean;
    order: number;
    description?: string;
    descriptionEn?: string;
    required?: boolean;
    minSelections?: number;
    maxSelections?: number;
    allowCustomAnswer?: boolean;
    customAnswerPlaceholder?: string;
    placeholder?: string;
    multiline?: boolean;
    maxLength?: number;
    minLength?: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    createdAt?: string;
    updatedAt?: string;
    isActive: boolean;
    conditionalDisplay?: {
        dependsOn: string;
        showWhen: any;
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    nationality?: string;
}

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'candidate' | 'admin';
    phone?: string;
    nationality?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token: string;
    user: User;
}

export interface TestSubmission {
    originCountry: string;
    destinationCountry: string;
    answers: Record<string, any>;
}

export interface TestResponse {
    success: boolean;
    message: string;
    submission: {
        id: string;
        originCountry: string;
        destinationCountry: string;
        score: number;
        completedAt: string;
    };
}

export interface SavedTest {
    id: string;
    originCountry: string;
    destinationCountry: string;
    answers: Record<string, any>;
    score: number;
    status: string;
    completedAt: string;
    createdAt: string;
}

class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
        console.log('🔗 API Service initialized with URL:', this.baseUrl);
    }

    async getBriefing(submissionId: string): Promise<{ success: boolean; briefing?: string }> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const url = `${this.baseUrl}/tests/briefing/${submissionId}`;
            console.log('📡 Fetching briefing for submission:', submissionId);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération du briefing');
            }

            const data = await response.json();
            return {
                success: data.success,
                briefing: data.briefing
            };
        } catch (error) {
            console.error('API getBriefing error:', error);
            return { success: false };
        }
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const url = `${this.baseUrl}/auth/login`;
            console.log('📡 Logging in...');

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur de connexion');
            }

            const data = await response.json();
            console.log('✅ Login successful');

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return data;
        } catch (error: any) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            const url = `${this.baseUrl}/auth/register`;
            console.log('📡 Registering...');

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Erreur lors de l'inscription");
            }

            const responseData = await response.json();
            console.log('✅ Registration successful');

            localStorage.setItem('authToken', responseData.token);
            localStorage.setItem('user', JSON.stringify(responseData.user));

            return responseData;
        } catch (error: any) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    }

    async getCurrentUser(): Promise<User> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Non authentifié');

            const url = `${this.baseUrl}/auth/me`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Session expirée');

            const data = await response.json();
            return data.user;
        } catch (error: any) {
            console.error('❌ Get user error:', error);
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        console.log('✅ Logged out');
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('authToken');
    }

    getStoredUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    async getAllQuestions(): Promise<Question[]> {
        try {
            const url = `${this.baseUrl}/questions`;
            console.log('📡 Fetching all questions from:', url);

            const response = await fetch(url);
            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('✅ Questions received:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching questions:', error);
            throw error;
        }
    }

    async getQuestionByKey(key: string): Promise<Question> {
        try {
            console.log('📡 Fetching question with key:', key);

            const questions = await this.getAllQuestions();
            const question = questions.find(q => q.key === key);

            if (!question) {
                throw new Error(`Question with key ${key} not found`);
            }

            console.log('✅ Question found:', question);
            return question;
        } catch (error) {
            console.error('❌ Error fetching question by key:', error);
            throw error;
        }
    }

    async getQuestionsByCategory(category: string): Promise<Question[]> {
        try {
            console.log('📡 Fetching questions for category:', category);

            const questions = await this.getAllQuestions();
            const filtered = questions.filter(q => q.category === category);

            console.log('✅ Filtered questions:', filtered);
            return filtered;
        } catch (error) {
            console.error('❌ Error fetching questions by category:', error);
            throw error;
        }
    }

    async submitTest(testData: TestSubmission): Promise<TestResponse> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté pour soumettre un test');

            const url = `${this.baseUrl}/tests/submit`;
            console.log('📡 Submitting test...');

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la soumission');
            }

            const data = await response.json();
            console.log('✅ Test submitted successfully:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Submit test error:', error);
            throw error;
        }
    }

    async getMyTests(): Promise<{ success: boolean; count: number; tests: SavedTest[] }> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const url = `${this.baseUrl}/tests/my-tests`;
            console.log('📡 Fetching my tests...');

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des tests');
            }

            const data = await response.json();
            console.log('✅ Tests retrieved:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Get tests error:', error);
            throw error;
        }
    }

    async getTestById(testId: string): Promise<{ success: boolean; test: SavedTest }> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const url = `${this.baseUrl}/tests/${testId}`;
            console.log('📡 Fetching test:', testId);

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Test non trouvé');

            const data = await response.json();
            console.log('✅ Test retrieved:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Get test error:', error);
            throw error;
        }
    }

    async deleteTest(testId: string): Promise<{ success: boolean; message: string }> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Vous devez être connecté');

            const url = `${this.baseUrl}/tests/${testId}`;
            console.log('📡 Deleting test:', testId);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erreur lors de la suppression');

            const data = await response.json();
            console.log('✅ Test deleted:', data);
            return data;
        } catch (error: any) {
            console.error('❌ Delete test error:', error);
            throw error;
        }
    }

    async submitAnswers(answers: Record<string, any>): Promise<any> {
        console.warn('⚠️ submitAnswers is deprecated. Use submitTest instead.');
        return this.submitTest({
            originCountry: 'Unknown',
            destinationCountry: 'Unknown',
            answers
        });
    }

    async createQuestion(questionData: any): Promise<any> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Non authentifié');

            const url = `${this.baseUrl}/admin/questions`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(questionData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la création');
            }

            return await response.json();
        } catch (error: any) {
            throw error;
        }
    }

    async updateQuestion(questionId: string, questionData: any): Promise<any> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Non authentifié');

            const url = `${this.baseUrl}/admin/questions/${questionId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(questionData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la mise à jour');
            }

            return await response.json();
        } catch (error: any) {
            throw error;
        }
    }

    async deleteQuestion(questionId: string): Promise<any> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Non authentifié');

            const url = `${this.baseUrl}/admin/questions/${questionId}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la suppression');
            }

            return await response.json();
        } catch (error: any) {
            throw error;
        }
    }

    async getQuestionByOrder(order: number): Promise<Question | null> {
        try {
            console.log(`🔍 Fetching question ${order}...`);

            const questions = await this.getAllQuestions();
            const question = questions.find(q => q.order === order && q.isActive);

            if (!question) {
                console.log(`⚠️  Question ${order} not found or not active`);
                return null;
            }

            console.log(`✅ Question ${order} found:`, question.label);
            return question;
        } catch (error) {
            console.error(`❌ Error fetching question ${order}:`, error);
            return null;
        }
    }
}

export const apiService = new ApiService();

export default ApiService;
