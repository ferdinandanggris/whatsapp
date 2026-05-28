import ChatLayout from "../components/ChatLayout"
import { useAuth } from "../stores/auth"

export default function Inbox() {
  const { user } = useAuth()
  return <ChatLayout user={user} enableLogin={false} />
}
