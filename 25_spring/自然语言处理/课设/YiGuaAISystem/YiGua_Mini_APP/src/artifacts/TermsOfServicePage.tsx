import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

interface TermsOfServicePageProps {
  setCurrentPage: Dispatch<SetStateAction<string>>;
}

const TermsOfServicePage = ({ setCurrentPage }: TermsOfServicePageProps) => {
  return (
    <div className="p-4">
      <header className="mb-4 flex items-center">
        <button onClick={() => setCurrentPage('profile')} className="mr-2">
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">服务条款</h1>
      </header>
      
      <div className="paper-card rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">软件服务及隐私条款</h2>
        
        <p className="mb-3">
          欢迎您使用易卦软件及服务，以下内容请仔细阅读。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">1. 基本原则</h3>
        <p className="mb-3">
          保护用户个人信息是一项基本原则，我们将会采取合理的措施保护用户的个人信息。除法律法规规定的情形外，未经用户许可我们不会向第三方公开、透漏个人信息。易卦对相关信息采用专业加密存储与传输方式，保障用户个人信息安全，如果您选择同意使用易卦软件，即表示您认可并接受易卦服务条款及其可能随时更新的内容。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">2. 应用权限</h3>
        <p className="mb-3">
          我们将会使用您的以下功能：存储权限（用于保存您的个人信息和占卜记录）。如果您禁止易卦使用以上相关服务和功能，您将自行承担不能获得或享用易卦相应服务的后果。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">3. 技术数据收集</h3>
        <p className="mb-3">
          为了提供更好的客户服务，基于技术必要性收集一些有关设备级别事件（例如崩溃）的信息，但这些信息并不能够让我们识别您的身份。我们将对上述信息实施技术保护措施，以最大程度保护这些信息不被第三方非法获得，同时，您可以自行选择拒绝我们基于技术必要性收集的这些信息，并自行承担不能获得或享用易卦相应服务的后果。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">4. 个人信息的使用</h3>
        <p className="mb-3">
          在您使用我们的产品或服务的过程中，我们可能需要您提供个人信息，如姓名、性别、出生日期时辰等以及使用服务时需要的其它类似个人信息；您对我们的产品和服务使用即表明您同意我们对这些信息的收集和合理使用。您可以自行选择拒绝、放弃使用相关产品或服务。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">5. 免责声明</h3>
        <p className="mb-3">
          由于您的自身行为或不可抗力等情形，导致上述可能涉及您隐私或您认为是私人信息的内容发生被泄露、披露，或被第三方获取、使用、转让等情形的，均由您自行承担不利后果，我们对此不承担任何责任。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">6. 条款解释</h3>
        <p className="mb-3">
          我们拥有对上述条款的最终解释权。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">7. 命理分析免责声明</h3>
        <p className="mb-3">
          易卦应用提供的命理分析、占卜解读和预测仅供参考和娱乐，不应被视为专业建议或决策依据。用户应对自己的决策和行为负责，我们不对因使用本应用提供的信息而导致的任何后果承担责任。
        </p>
        
        <p className="text-gray-500 text-sm mt-6">
          更新日期：2025年5月10日
        </p>
      </div>
    </div>
  );
};

export default TermsOfServicePage;