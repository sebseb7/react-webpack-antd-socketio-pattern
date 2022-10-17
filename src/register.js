import { Row, Col, Alert, Button, Space, Card, Form, Input } from 'antd';

const formItemLayout = {
	labelCol: {
		xs: {
			span: 24,
		},
		sm: {
			span: 10,
		},
	},
	wrapperCol: {
		xs: {
			span: 24,
		},
		sm: {
			span: 16,
		},
	},
};

const tailFormItemLayout = {
	wrapperCol: {
		xs: {
			span: 24,
			offset: 0,
		},
		sm: {
			span: 16,
			offset: 10,
		},
	},
};

export default function Register(props){
	const [form] = Form.useForm();

	return (
		<Row justify="center">
			<Col span={12}>
				<Card>
					<Form {...formItemLayout} form={form} name="register" onFinish={props.onFinish} initialValues={{}} scrollToFirstError>
					
						<Form.Item name="username" label="Username" rules={[
							{
								required: true,
								message: 'Please input your username!',
								whitespace: true,
							},
						]}>
							<Input />
						</Form.Item>

						<Form.Item name="email" label="E-mail" rules={[
							{
								type: 'email',
								message: 'The input is not valid E-mail!',
							},
							{
								required: true,
								message: 'Please input your E-mail!',
							},
						]}>
							<Input />
						</Form.Item>

						<Form.Item name="password" label="Password" rules={[
							{
								required: true,
								message: 'Please input your password!',
							},
						]} hasFeedback>
							<Input.Password />
						</Form.Item>

						<Form.Item name="confirm" label="Confirm Password" dependencies={['password']} hasFeedback rules={[
							{
								required: true,
								message: 'Please confirm your password!',
							},
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!value || getFieldValue('password') === value) {
										return Promise.resolve();
									}
									return Promise.reject(new Error('The two passwords that you entered do not match!'));
								},
							}),
						]}>
							<Input.Password />
						</Form.Item>

						<Form.Item {...tailFormItemLayout}>
							<Space>
								<Button type="primary" htmlType="submit">Register</Button>
								<Button href="#/">Back</Button>
							</Space>
						</Form.Item>

						{ props.error &&
							<Alert message={props.error} type="error" />
						}
						
					</Form>
				</Card>
			</Col>
		</Row>
	);
}
