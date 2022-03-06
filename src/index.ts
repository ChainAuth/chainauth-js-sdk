import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { ethers, Signature } from 'ethers';
import { ClientSettings } from './types';

class PublicClient {
  private settings: ClientSettings;
  private baseUrl = new URL('/api/v1', 'http://localhost:2222');
  private _axios: AxiosInstance;
  private _ethProvider: ethers.providers.Web3Provider;

  constructor(settings?: ClientSettings) {
    if (!settings) return;
    this.setSettings(settings);
    if (this.settings?.apiKey) {
      this._axios = this._newAxios();
    }
  }

  private _newAxios(): AxiosInstance {
    if (!this.baseUrl) {
      throw new Error('Base URL is not set');
    }
    if (!this.settings?.apiKey) {
      throw new Error('API key is not set');
    }
    const axiosInstance = axios.create({
      baseURL: this.baseUrl.toString(),
      timeout: 1000,
      headers: {
        'X-API-Key': this.settings.apiKey,
      }
    });
    // Set retry policy for axios requests
    axiosRetry(axiosInstance, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
    return axiosInstance;
  }

  public setSettings = (settings: ClientSettings): void => {
    this.settings = settings;
    this._axios = this._newAxios();
  }

  public getSettings = (): ClientSettings => {
    return this.settings;
  }

  public getLoginNonce = async (): Promise<string> => {
    if (!this.settings.apiKey) {
      throw new Error('API key is not set');
    }
    const response = await this._axios.get('/generate_nonce');
    if (!response?.data?.data) {
      throw new Error("Get nonce failed: response doesn't contain data");
    }
    return response?.data?.data;
  }

  private initEthProvider = () => {
    const win = window as any;
    if (!win.ethereum) {
      throw new Error("Ethereum is not available");
    }
    this._ethProvider = new ethers.providers.Web3Provider(win.ethereum)
  }

  public getLoginSignature = async (nonce: string): Promise<{address: string, signature: Signature}> => {
    if (!this.settings.apiKey) {
      throw new Error('API key is not set');
    }
    if (!this._ethProvider) {
      this.initEthProvider();
    }
    const provider = this._ethProvider;
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const signatureRaw = await signer.signMessage(nonce);
    const signature = ethers.utils.splitSignature(signatureRaw)
    const address =  await signer.getAddress();
    return { address, signature };
  }

  public getTokenFromSigature = async (nonce: string, signature: Signature): Promise<string> => {
    if (!this.settings.apiKey) {
      throw new Error('API key is not set');
    }
    const response = await this._axios.post('/login', {
      nonce,
      signature,
    });
    if (!response?.data?.data) {
      throw new Error("Get nonce failed: response doesn't contain data");
    }
    return response?.data?.data;
  }
}

const publiclient = new PublicClient();


export { publiclient };
export default PublicClient;