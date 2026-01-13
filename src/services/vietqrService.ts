export interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

export interface QRGenerateParams {
  accountNo: string;
  accountName: string;
  acqId: string;
  amount: number;
  addInfo: string;
  format?: 'text' | 'binary';
  template?: 'compact' | 'qr_only' | 'print';
}

export interface QRGenerateResponse {
  code: string;
  desc: string;
  data: {
    qrCode: string;
    qrDataURL: string;
  };
}

const VIETQR_API_BASE = 'https://api.vietqr.io/v2';

export class VietQRService {
  private static instance: VietQRService;
  private bankListCache: VietQRBank[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

  private constructor() { }

  static getInstance(): VietQRService {
    if (!VietQRService.instance) {
      VietQRService.instance = new VietQRService();
    }
    return VietQRService.instance;
  }

  async getBankList(): Promise<VietQRBank[]> {
    if (this.bankListCache && Date.now() < this.cacheExpiry) {
      return this.bankListCache;
    }

    try {
      const response = await fetch(`${VIETQR_API_BASE}/banks`);
      if (!response.ok) {
        throw new Error('Failed to fetch bank list');
      }

      const result = await response.json();

      if (result.code === '00' && result.data) {
        this.bankListCache = result.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return result.data;
      }

      throw new Error(result.desc || 'Unknown error');
    } catch (error) {
      console.error('VietQR getBankList error:', error);

      // Trả về danh sách dự phòng
      return this.getFallbackBanks();
    }
  }

  async generateQRCode(params: QRGenerateParams): Promise<string> {
    try {
      const payload = {
        accountNo: params.accountNo,
        accountName: this.removeVietnameseTones(params.accountName.toUpperCase()),
        acqId: params.acqId,
        amount: params.amount,
        addInfo: this.removeVietnameseTones(params.addInfo.toUpperCase()),
        format: params.format || 'text',
        template: params.template || 'compact'
      };

      const response = await fetch(`${VIETQR_API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const result: QRGenerateResponse = await response.json();

      if (result.code === '00' && result.data?.qrDataURL) {
        return result.data.qrDataURL;
      }

      throw new Error(result.desc || 'Unknown error');
    } catch (error) {
      console.error('VietQR generateQRCode error:', error);
      throw error;
    }
  }

  validateBankAccount(accountNumber: string, accountName: string): { valid: boolean; error?: string } {
    if (!accountNumber || accountNumber.trim() === '') {
      return { valid: false, error: 'Số tài khoản không được để trống' };
    }

    if (!/^\d+$/.test(accountNumber)) {
      return { valid: false, error: 'Số tài khoản chỉ được chứa số' };
    }

    if (accountNumber.length < 6 || accountNumber.length > 20) {
      return { valid: false, error: 'Số tài khoản phải từ 6-20 chữ số' };
    }

    if (!accountName || accountName.trim() === '') {
      return { valid: false, error: 'Tên chủ tài khoản không được để trống' };
    }

    if (accountName.length < 3) {
      return { valid: false, error: 'Tên chủ tài khoản phải ít nhất 3 ký tự' };
    }

    return { valid: true };
  }

  private removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  private getFallbackBanks(): VietQRBank[] {
    return [
      { id: 1, name: 'Ngân hàng TMCP Ngoại Thương Việt Nam', code: 'VCB', bin: '970436', shortName: 'Vietcombank', logo: '', transferSupported: 1, lookupSupported: 1 },
      { id: 2, name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', code: 'BIDV', bin: '970418', shortName: 'BIDV', logo: '', transferSupported: 1, lookupSupported: 1 },
      { id: 3, name: 'Ngân hàng TMCP Công Thương Việt Nam', code: 'VTB', bin: '970415', shortName: 'Vietinbank', logo: '', transferSupported: 1, lookupSupported: 1 },
      { id: 4, name: 'Ngân hàng TMCP Kỹ Thương Việt Nam', code: 'TCB', bin: '970407', shortName: 'Techcombank', logo: '', transferSupported: 1, lookupSupported: 1 },
      { id: 5, name: 'Ngân hàng TMCP Á Châu', code: 'ACB', bin: '970416', shortName: 'ACB', logo: '', transferSupported: 1, lookupSupported: 1 },
      { id: 6, name: 'Ngân hàng TMCP Quân Đội', code: 'MB', bin: '970422', shortName: 'MB Bank', logo: '', transferSupported: 1, lookupSupported: 1 },
      { id: 7, name: 'Ngân hàng TMCP Tiên Phong', code: 'TPB', bin: '970423', shortName: 'TPBank', logo: '', transferSupported: 1, lookupSupported: 1 },
      { id: 8, name: 'Ngân hàng TMCP Sài Gòn Thương Tín', code: 'STB', bin: '970403', shortName: 'Sacombank', logo: '', transferSupported: 1, lookupSupported: 1 },
      { id: 9, name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', code: 'VPB', bin: '970432', shortName: 'VPBank', logo: '', transferSupported: 1, lookupSupported: 1 },
      { id: 10, name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', code: 'SHB', bin: '970443', shortName: 'SHB', logo: '', transferSupported: 1, lookupSupported: 1 },
    ];
  }
}

export const vietQRService = VietQRService.getInstance();
