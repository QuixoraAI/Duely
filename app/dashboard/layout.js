import ChatBubble from "../../components/ChatBubble";

export default function DashboardLayout({ children }) {
  return (
    <>
      {children}
      <ChatBubble />
    </>
  );
}
