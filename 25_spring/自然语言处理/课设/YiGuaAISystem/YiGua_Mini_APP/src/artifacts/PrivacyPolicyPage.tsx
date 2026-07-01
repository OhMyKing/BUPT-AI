import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

interface PrivacyPolicyPageProps {
  setCurrentPage: Dispatch<SetStateAction<string>>;
}

const PrivacyPolicyPage = ({ setCurrentPage }: PrivacyPolicyPageProps) => {
  return (
    <div className="p-4">
      <header className="mb-4 flex items-center">
        <button onClick={() => setCurrentPage('profile')} className="mr-2">
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">隐私政策</h1>
      </header>
      
      <div className="paper-card rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">隐私政策</h2>
        
        <p className="mb-3">
          本应用尊重并保护所有使用服务用户的个人隐私权。为了给您提供更准确、更有个性化的服务，本应用会按照本隐私权政策的规定使用和披露您的个人信息。但本应用将以高度的勤勉、审慎义务对待这些信息。除本隐私权政策另有规定外，在未征得您事先许可的情况下，本应用不会将这些信息对外披露或向第三方提供。本应用会不时更新本隐私权政策。您在同意本应用服务使用协议之时，即视为您已经同意本隐私权政策全部内容。本隐私权政策属于本应用服务使用协议不可分割的一部分。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">1. 适用范围</h3>
        <p className="mb-3">
          (a) 在您使用本应用时，本应用自动接收并记录的您的设备信息，包括但不限于您的设备型号、操作系统版本、设备设置、应用程序使用记录等数据；
        </p>
        <p className="mb-3">
          您了解并同意，以下信息不适用本隐私权政策：
        </p>
        <p className="mb-3">
          (a) 本应用收集到的您在本应用输入的命理信息，包括但不限于生辰八字、占卜记录及相关查询；
        </p>
        <p className="mb-3">
          (b) 违反法律规定或违反本应用规则行为及本应用已对您采取的措施。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">2. 信息使用</h3>
        <p className="mb-3">
          (a) 本应用不会向任何无关第三方提供、出售、出租、分享或交易您的个人信息，除非事先得到您的许可，或该第三方和本应用单独或共同为您提供服务，且在该服务结束后，其将被禁止访问包括其以前能够访问的所有这些资料。
        </p>
        <p className="mb-3">
          (b) 本应用亦不允许任何第三方以任何手段收集、编辑、出售或者无偿传播您的个人信息。任何本应用平台用户如从事上述活动，一经发现，本应用有权立即终止与该用户的服务协议。
        </p>
        <p className="mb-3">
          (c) 本应用收集的信息将保存在您的设备本地，用于提供更准确的命理分析和相关服务。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">3. 信息披露</h3>
        <p className="mb-3">
          在如下情况下，本应用将依据您的个人意愿或法律的规定全部或部分的披露您的个人信息：
        </p>
        <p className="mb-3">
          (a) 经您事先同意，向第三方披露；
        </p>
        <p className="mb-3">
          (b) 为提供您所要求的产品和服务，而必须和第三方分享您的个人信息；
        </p>
        <p className="mb-3">
          (c) 根据法律的有关规定，或者行政或司法机构的要求，向第三方或者行政、司法机构披露；
        </p>
        <p className="mb-3">
          (d) 如您出现违反中国有关法律、法规或者本应用服务协议或相关规则的情况，需要向第三方披露；
        </p>
        <p className="mb-3">
          (e) 其它本应用根据法律、法规或者应用政策认为合适的披露。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">4. 信息存储和交换</h3>
        <p className="mb-3">
          本应用收集的有关您的信息和资料将保存在您的设备本地，这些信息仅供您在本设备上使用，不会上传到服务器或跨设备传输。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">5. 信息安全</h3>
        <p className="mb-3">
          (a) 本应用将尽力保护您的信息安全，保障您的信息不丢失，不被滥用和变造。尽管有前述安全措施，但同时也请您注意在信息网络上不存在"完善的安全措施"。
        </p>
        <p className="mb-3">
          (b) 请您妥善保护自己的个人信息，仅在必要的情形下向他人提供。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">6. 本隐私政策的更改</h3>
        <p className="mb-3">
          (a) 如果决定更改隐私政策，我们会在本政策中、本应用中以及我们认为适当的位置发布这些更改，以便您了解我们如何收集、使用您的个人信息，哪些人可以访问这些信息，以及在什么情况下我们会透露这些信息。
        </p>
        <p className="mb-3">
          (b) 本应用保留随时修改本政策的权利，因此请经常查看。如对本政策作出重大更改，本应用会通过应用内通知的形式告知。
        </p>
        
        <h3 className="font-semibold mt-4 mb-2">7. 软件服务及权限说明</h3>
        <p className="mb-3">
          我们可能会使用您的以下功能权限：存储权限（用于保存占卜记录和个人信息）。如果您禁止应用使用以上相关服务和功能，您将自行承担不能获得或享用相应服务的后果。
        </p>
        <p className="mb-3">
          为了提供更好的服务，基于技术必要性，我们可能会收集一些有关设备级别事件（例如崩溃）的信息，但这些信息不会识别您的身份。您可以自行选择拒绝我们基于技术必要性收集的这些信息，并自行承担不能获得或享用相应服务的后果。
        </p>
        
        <p className="text-gray-500 text-sm mt-6">
          请您妥善保护自己的个人信息，仅在必要的情形下提供。如发现个人信息泄露，请立即联系我们。
        </p>
        
        <p className="text-gray-500 text-sm mt-4">
          更新日期：2025年5月10日
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;