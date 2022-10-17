import { Row, Col, Card, Button, Form, Input, Space, Alert } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faKey,faUser} from '@fortawesome/free-solid-svg-icons';
library.add(faKey,faUser);
import { Link } from "react-router-dom";

export default function Login(props)
{
	return (
		<Row justify="center">
			<Col span={6}>
				<Card>
					<Form name="normal_login" className="login-form" initialValues={{}} onFinish={props.onFinish}>
						<Form.Item name="username" rules={[{ required: true, message: 'Please input your Username!' }]}>
							<Input prefix={<FontAwesomeIcon icon="fa-solid fa-user" />} placeholder="Username" />
						</Form.Item>
						<Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
							<Input prefix={<FontAwesomeIcon icon="fa-solid fa-key" />} type="password" placeholder="Password"/>
						</Form.Item>
						<Form.Item>
							<Space>
								<Button type="primary" htmlType="submit" className="login-form-button">Log in</Button>
								or <Link to="register">register</Link>
							</Space>
						</Form.Item>
						<Space direction="vertical">
							{ props.error &&
								<Alert message={props.error} type="error" />
							}
							<a className="login-form-forgot" href="#/forgot">
								Forgot password
							</a>
						</Space>
					</Form>
				</Card>
			</Col>
		</Row>
	);
}
